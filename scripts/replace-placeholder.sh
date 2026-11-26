FROM=$1
TO=$2

if [ "${FROM}" = "${TO}" ]; then
    echo "Nothing to replace, the value is already set to ${TO}."
    exit 0
fi

echo "Replacing all statically built instances of $FROM with $TO."

# Escape characters that are special in a sed replacement expression. Without
# this, "&" expands to the matched text and "|" terminates the substitution.
ESCAPED_TO=$(printf '%s' "${TO}" | sed -e 's/[\\&|]/\\&/g')

for file in $(egrep -r -l "${FROM}" apps/web/.next/ apps/web/public/); do
    sed -i -e "s|$FROM|$ESCAPED_TO|g" "$file"
done
